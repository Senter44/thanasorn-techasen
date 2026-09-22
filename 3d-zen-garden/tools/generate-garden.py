import bpy
import math
import random
import json
from pathlib import Path
from mathutils import Vector
from mathutils.noise import noise_vector

OUT = Path(__file__).resolve().parent
random.seed(7231)
bpy.ops.wm.read_factory_settings(use_empty=True)


def material(name, color, roughness=0.7, metallic=0.0):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    bs = m.node_tree.nodes.get('Principled BSDF')
    bs.inputs['Base Color'].default_value = (*color, 1)
    bs.inputs['Roughness'].default_value = roughness
    bs.inputs['Metallic'].default_value = metallic
    return m


sand = material('Ivory limestone sand', (0.76, 0.704, 0.585), .96)
rake = material('Fine warm sand ridges', (0.825, 0.77, 0.65), .98)
earth = material('Cut warm earth', (.24, .205, .15), 1)
earth_edge = material('Weathered earth ledge', (.34, .295, .23), .95)
stone = [material('Weathered basalt %02d' % i, c, .9) for i, c in enumerate([
    (.215, .23, .20), (.265, .28, .255), (.32, .325, .285), (.185, .205, .185)])]
pathmat = material('Honed gray stepping stones', (.39, .405, .365), .94)
moss = [material('Velvet moss %02d' % i, c, .98) for i, c in enumerate([
    (.225, .30, .10), (.285, .365, .13), (.18, .265, .10), (.335, .39, .155)])]
wood = material('Aged cedar timber', (.205, .125, .07), .85)
woodlight = material('Worn cedar end grain', (.295, .19, .105), .83)
roofmat = [material('Charred cedar roof %02d' % i, c, .88) for i, c in enumerate([
    (.12, .145, .125), (.16, .178, .15), (.185, .19, .155), (.095, .125, .105)])]
water = material('Pond bluegreen water', (.12, .305, .27), .12, .12)
water.node_tree.nodes.get('Principled BSDF').inputs['IOR'].default_value = 1.333
leafmats = [material('Japanese foliage %02d' % i, c, .9) for i, c in enumerate([
    (.15, .255, .105), (.235, .345, .14), (.32, .395, .17), (.395, .42, .205), (.20, .31, .13)])]
bark = material('Weathered silver brown bark', (.29, .255, .185), .95)
fernmat = material('Fern fronds', (.245, .36, .135), .92)
bronze = material('Muted bronze detail', (.30, .245, .12), .56, .38)


def group(name):
    o = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(o)
    return o


roots = {name: group(name) for name in ['Garden', 'Pavilion', 'Projects', 'Journey', 'Pond', 'Perimeter']}
for name, obj in roots.items():
    if name != 'Garden':
        obj.parent = roots['Garden']


def P(x, z, h):
    return Vector((x, -z, h))


def setup(obj, name, mat, parent='Garden', smooth=False):
    obj.name = name
    obj.data.materials.append(mat)
    obj.parent = roots[parent]
    if smooth and obj.type == 'MESH':
        for face in obj.data.polygons:
            face.use_smooth = True
    return obj


def mesh(name, verts, faces, mat, parent='Garden', smooth=False):
    data = bpy.data.meshes.new(name)
    data.from_pydata(verts, [], faces)
    data.update()
    ob = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(ob)
    return setup(ob, name, mat, parent, smooth)


def rounded_slab(name, width, depth, bottom, top, radius, mat):
    ring = []
    for cx, cy, a in [(width/2-radius, depth/2-radius, 0),
                      (-width/2+radius, depth/2-radius, 90),
                      (-width/2+radius, -depth/2+radius, 180),
                      (width/2-radius, -depth/2+radius, 270)]:
        for j in range(9):
            t = math.radians(a + j*90/8)
            ring.append((cx+radius*math.cos(t), cy+radius*math.sin(t)))
    n = len(ring)
    verts = [(x, y, h) for h in (bottom, top) for x,y in ring]
    faces = [tuple(range(n-1, -1, -1)), tuple(range(n, n*2))]
    faces += [(i, (i+1)%n, (i+1)%n+n, i+n) for i in range(n)]
    ob = mesh(name, verts, faces, mat)
    be = ob.modifiers.new('Soft eroded edges', 'BEVEL')
    be.width = .11
    be.segments = 3
    ob.modifiers.new('Weighted surface normals', 'WEIGHTED_NORMAL')
    return ob


rounded_slab('GardenEarthBase', 16, 10, -.77, -.18, 1.2, earth)
rounded_slab('GardenEarthRim', 15.9, 9.9, -.28, -.045, 1.16, earth_edge)
rounded_slab('GardenSand', 15.68, 9.68, -.115, 0, 1.10, sand)


def cube(name, center, scale, mat, parent='Garden', bevel=.025):
    bpy.ops.mesh.primitive_cube_add(size=1, location=P(*center))
    ob = bpy.context.object
    ob.scale = (scale[0], scale[1], scale[2])
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    setup(ob, name, mat, parent)
    if bevel:
        b = ob.modifiers.new('Worn timber corners', 'BEVEL')
        b.width = bevel
        b.segments = 2
        ob.modifiers.new('Weighted timber normals', 'WEIGHTED_NORMAL')
    return ob


def branch(name, a, b, r0, r1, mat, parent='Perimeter', vertices=9):
    va, vb = P(*a), P(*b)
    mid = (va+vb)*.5
    bpy.ops.mesh.primitive_cone_add(vertices=vertices, radius1=r0, radius2=r1,
                                  depth=(vb-va).length, location=mid)
    ob = bpy.context.object
    ob.rotation_euler = (vb-va).to_track_quat('Z', 'Y').to_euler()
    return setup(ob, name, mat, parent, True)


def curve(name, points, thickness, mat, parent='Garden'):
    data = bpy.data.curves.new(name, 'CURVE')
    data.dimensions = '3D'
    data.resolution_u = 1
    data.bevel_depth = thickness
    data.bevel_resolution = 1
    spline = data.splines.new('POLY')
    spline.points.add(len(points)-1)
    for q, pt in zip(spline.points, points):
        q.co = (*P(*pt), 1)
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    data.materials.append(mat)
    obj.parent = roots[parent]
    return obj


def rock(name, center, scale, mat, parent='Projects', seed=0, subdivisions=2):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=subdivisions, radius=1, location=P(*center))
    ob = bpy.context.object
    for v in ob.data.vertices:
        p = v.co
        n = noise_vector(p*2.6 + Vector((seed, seed*.47, seed*.12)))
        factor = 1 + n.x*.15 + n.y*.09
        p.x *= scale[0]*factor
        p.y *= scale[1]*factor
        p.z *= scale[2]*(1+n.z*.16)
    ob.rotation_euler.z = random.uniform(-math.pi, math.pi)
    setup(ob, name, mat, parent, True)
    return ob


# Winding rake ridges are real geometry with quiet relief and irregular spacing.
def blocked(x, z):
    return (((x-3)/2.15)**2 + ((z+2)/1.63)**2 < 1 or
            ((x-4)/2.0)**2 + ((z-2.5)/1.60)**2 < 1 or
            (-6.5 < x < -1.5 and -3.85 < z < -.12) or
            (-5.58 < x < -2.42 and 1.12 < z < 4.28))


for i in range(50):
    zbase = -4.55+i*.184
    points = []
    for j in range(150):
        x = -7.55+j*15.1/149
        z = zbase + .11*math.sin(x*.63+zbase*.45)
        cornerok = abs(x) < 6.5 or abs(z) < 3.5 or (abs(x)-6.5)**2+(abs(z)-3.5)**2 < 1.10**2
        if blocked(x,z) or not cornerok:
            if len(points) > 2:
                curve('GardenRakedSand_%02d' % i, points, .010, rake)
            points = []
        else:
            points.append((x,z,.006))
    if len(points)>2:
        curve('GardenRakedSand_%02d' % i, points, .010, rake)

for k in range(5):
    rx, rz = 1.50+k*.16, 1.00+k*.135
    points = [(3+rx*math.cos(t*2*math.pi/100), -2+rz*math.sin(t*2*math.pi/100), .009) for t in range(101)]
    curve('ProjectsConcentricRaking_%02d' % k, points, .012, rake, 'Projects')

# Low moss island and upright weathered monoliths.
rock('ProjectsMossIsland', (3,-2,.035), (1.50,1.02,.09), moss[1], seed=32, subdivisions=3)
rock_specs = [(2.75,-2.05,.83,.63,.54,1.10), (3.55,-2.30,.55,.60,.49,.72),
              (2.15,-1.67,.24,.61,.48,.40), (3.65,-1.46,.20,.48,.38,.28),
              (3.20,-2.55,.21,.52,.31,.34)]
for i,(x,z,h,sx,sz,sy) in enumerate(rock_specs):
    rock('ProjectsStandingStone_%02d' % i, (x,z,h), (sx,sz,sy), stone[i%4], seed=i*4)
    rock('ProjectsMossCap_%02d' % i, (x-.08,z+.06,h+sy*.80), (sx*.69,sz*.63,sy*.14), moss[i%4], seed=i*5+71)

# Deliberately empty, flat 3 x 3 clearing for the separately animated bamboo.
rock('BambooMossClearing', (-4,2.7,.028), (1.65,1.63,.047), moss[2], 'Garden', seed=150, subdivisions=3)

# Rounded, individually shaped stepping-stone path.
pathpoints = [(-2.30,-.12), (-1.48,.22), (-.68,.52), (.20,.72), (.95,1.16),
              (1.35,1.92), (1.20,2.77), (.63,3.53), (-.14,4.03)]
for i,(x,z) in enumerate(pathpoints):
    rock('JourneySteppingStone_%02d' % (i+1), (x,z,.055), (.47,.37,.115), pathmat, 'Journey', seed=80+i, subdivisions=2)

# Open timber pavilion: planked platform, four columns, decorative knees and tiled wood roof.
cube('PavilionPlatformFoundation', (-4,-2,.12), (4.25,3.18,.25), stone[1], 'Pavilion', .065)
for i in range(17):
    cube('PavilionDeckPlank_%02d' % i, (-6.02+i*.25,-2,.295), (.24,3.02,.12), woodlight if i%4==0 else wood, 'Pavilion', .012)
cube('PavilionEntryStep', (-4,-.22,.10), (2.15,.55,.19), woodlight, 'Pavilion', .025)
for x in [-5.72,-2.28]:
    for z in [-3.18,-.82]:
        cube('PavilionStoneFoot', (x,z,.35), (.40,.40,.18), stone[2], 'Pavilion', .05)
        cube('PavilionColumn', (x,z,1.58), (.19,.19,2.47), wood, 'Pavilion', .018)
        cube('PavilionColumnCollar', (x,z,2.61), (.29,.29,.14), woodlight, 'Pavilion', .015)
        for direction in [-1,1]:
            endx=x+direction*.47
            if -5.8 < endx < -2.2:
                branch('PavilionKneeBrace', (x,z,2.21), (endx,z,2.72), .075,.06,wood,'Pavilion',6)
for z in [-3.18,-.82]:
    cube('PavilionLongLintel', (-4,z,2.81), (3.98,.20,.23), wood, 'Pavilion')
for x in [-5.72,-2.28]:
    cube('PavilionCrossLintel', (x,-2,2.81), (.19,2.90,.21), wood, 'Pavilion')

# Each roof slat follows a gently swept eave profile rather than a toy box plane.
roof_profiles = [(-4.08,2.91),(-3.77,2.86),(-3.43,2.91),(-3.10,3.04),(-2.75,3.23),(-2.38,3.44),(-2.0,3.63),
                 (-1.62,3.44),(-1.25,3.23),(-.90,3.04),(-.57,2.91),(-.23,2.86),(.08,2.91)]
for i in range(31):
    x0=-6.46+i*.159
    verts=[]
    for x in [x0,x0+.152]:
        verts += [tuple(P(x,z,h)) for z,h in roof_profiles]
    n=len(roof_profiles)
    faces=[(j,j+1,j+1+n,j+n) for j in range(n-1)]
    ob=mesh('PavilionRoofSlat_%02d'%i, verts, faces, roofmat[i%4],'Pavilion')
    solid=ob.modifiers.new('Solid cedar thickness','SOLIDIFY')
    solid.thickness=.065
    bev=ob.modifiers.new('Soft shingle edges','BEVEL')
    bev.width=.012
    bev.segments=2
    ob.modifiers.new('Roof normals','WEIGHTED_NORMAL')
for x in [-6.48,-1.52]:
    curve('PavilionCurvedFascia', [(x,z,h-.025) for z,h in roof_profiles], .067, wood,'Pavilion')
cube('PavilionRoofRidge', (-4,-2,3.655), (5.06,.17,.14), roofmat[1], 'Pavilion', .04)
for x in [-5.72,-2.28]:
    branch('PavilionKingPost',(x,-2,2.88),(x,-2,3.55),.055,.04,wood,'Pavilion')
    branch('PavilionGableBrace',(x,-3.30,2.89),(x,-2,3.55),.055,.045,wood,'Pavilion')
    branch('PavilionGableBrace',(x,-.70,2.89),(x,-2,3.55),.055,.045,wood,'Pavilion')
cube('PavilionMeditationBench', (-4,-2.85,.74), (2.50,.49,.12), woodlight,'Pavilion')
for x in [-4.9,-3.1]:
    cube('PavilionBenchLeg',(x,-2.85,.50),(.16,.36,.42),wood,'Pavilion')

# Organic kidney pond, shallow slate basin, submerged stones, and individual edging.
pondoutline=[]
for i in range(72):
    a=i*math.tau/72
    radius=1+.10*math.sin(a*3+.4)+.045*math.sin(a*5)
    pondoutline.append((4+1.66*math.cos(a)*radius,2.5+1.10*math.sin(a)*radius))


def pond_disk(name, outline, h, mat):
    verts=[tuple(P(4,2.5,h))]+[tuple(P(x,z,h)) for x,z in outline]
    faces=[(0,(i+1)%len(outline)+1,i+1) for i in range(len(outline))]
    return mesh(name,verts,faces,mat,'Pond')


pond_disk('PondBasin',[(4+(x-4)*1.08,2.5+(z-2.5)*1.08) for x,z in pondoutline], .025,stone[3])
pond_disk('PondWater',pondoutline,.062,water)
for i in range(24):
    x,z=pondoutline[i*3]
    rock('PondEdgeStone_%02d'%i,(x,z,.080),(.28+random.random()*.09,.23+random.random()*.09,.13+random.random()*.065),stone[i%4],'Pond',seed=170+i)
    if i%4==0:
        rock('PondMossEdge_%02d'%i,(x-.03,z,.22),(.18,.14,.035),moss[i%4],'Pond',seed=470+i)
for i in range(3):
    x=4.65+i*.19
    z=2.07+math.sin(i*1.7)*.17
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=.15+i*.015, depth=.012, location=P(x,z,.076))
    setup(bpy.context.object,'PondLilyPad_%02d'%i,moss[0],'Pond')

# Branching Japanese trees: real narrow trunks and thousands of individual double-sided leaves.
def leafy_cluster(verts, faces, indices, cx,cz,h,sx,sz,sh,count):
    for j in range(count):
        theta=random.random()*math.tau
        r=math.sqrt(random.random())
        x=cx+math.cos(theta)*r*sx
        z=cz+math.sin(theta)*r*sz
        y=h+(random.random()-.5)*sh + .12*(1-r)
        length=random.uniform(.10,.22)
        width=length*random.uniform(.42,.66)
        phi=random.random()*math.tau
        tilt=random.uniform(-.55,.65)
        along=Vector((math.cos(phi),math.sin(phi),tilt)).normalized()*length
        across=Vector((-math.sin(phi),math.cos(phi),0))*width
        center=P(x,z,y)
        base=len(verts)
        verts.extend([tuple(center-along*.7),tuple(center-across),tuple(center+Vector((0,0,.025))),tuple(center+along),tuple(center+across)])
        faces.extend([(base,base+1,base+2),(base+1,base+3,base+2),(base+3,base+4,base+2),(base+4,base,base+2)])
        indices.extend([random.choices(range(5),[3,4,3,1,3])[0]]*4)


def tree(name,x,z,height,spread):
    positions=[(x,z,.06),(x+.10,z-.03,height*.30),(x+.01,z+.08,height*.58),(x+.25,z+.12,height*.79),(x+.22,z+.05,height)]
    for i in range(4):
        branch(name+'Trunk',positions[i],positions[i+1],.17*(1-i*.19),.17*(1-(i+1)*.19),bark)
    verts,faces,indices=[],[],[]
    for i in range(11):
        a=i*2.399+random.uniform(-.3,.3)
        ring=.34+(i%4)*.17
        h=height*(.60+(i%4)*.105)
        tx=x+math.cos(a)*spread*ring
        tz=z+math.sin(a)*spread*ring
        start=(x+.06,z+.05,h-.40)
        elbow=(x+(tx-x)*.58,z+(tz-z)*.58,h-.14)
        tip=(tx,tz,h)
        branch(name+'Branch',start,elbow,.05,.028,bark)
        branch(name+'Twig',elbow,tip,.028,.009,bark)
        leafy_cluster(verts,faces,indices,tx,tz,h,.55*spread,.47*spread,.33,75)
    ob=mesh(name+'Leaves',verts,faces,leafmats[0],'Perimeter')
    for mat in leafmats[1:]:
        ob.data.materials.append(mat)
    for face,idx in zip(ob.data.polygons,indices):
        face.material_index=idx
    for mat in leafmats:
        mat.use_backface_culling=False
    # Visible roots tie the airy canopy to the ground.
    for i in range(4):
        a=i*math.tau/4+.30
        branch(name+'SurfaceRoot',(x,z,.14),(x+math.cos(a)*.48,z+math.sin(a)*.48,.035),.055,.012,bark)


tree('PerimeterMapleLeft',-6.85,-3.48,3.80,.94)
tree('PerimeterMapleBack',-.70,-3.64,3.35,.85)
tree('PerimeterMapleRight',6.22,-3.38,3.30,1.04)
tree('PerimeterMapleSide',7.00,.05,2.68,.77)
tree('PerimeterMapleNearLeft',-7.00,.70,2.56,.66)

# Ferns are finely divided curved fronds, never solid cones.
def fern(name,x,z,size):
    verts,faces=[],[]
    for fr in range(9):
        a=fr*math.tau/9+random.uniform(-.15,.15)
        length=size*random.uniform(.75,1.1)
        line=[]
        for j in range(9):
            t=j/8
            r=length*t*.70
            h=.025+length*(math.sin(t*math.pi*.78)*.47)
            line.append((x+math.cos(a)*r,z+math.sin(a)*r,h))
        curve(name+'Stem',line,.006,fernmat,'Perimeter')
        for j in range(1,8):
            t=j/8
            xx,zz,hh=line[j]
            pinna=length*.19*math.sin(t*math.pi)*(.95-t*.4)
            for side in [-1,1]:
                along=Vector((math.cos(a),-math.sin(a),0))
                across=Vector((-math.sin(a),-math.cos(a),0))*side
                c=P(xx,zz,hh)
                tip=c+across*pinna+along*pinna*.35+Vector((0,0,.018))
                b=len(verts)
                verts.extend([tuple(c),tuple(c+along*.033),tuple(tip),tuple(c-along*.033)])
                faces.append((b,b+1,b+2,b+3))
    mesh(name+'Fronds',verts,faces,fernmat,'Perimeter')


for i,(x,z,s) in enumerate([(-7.1,-1.65,.66),(-6.65,3.72,.57),(-1.10,-4.25,.63),(.95,-4.30,.49),(6.2,-2.4,.62),(7.15,2.2,.67),(6.48,3.68,.50),(-.8,4.15,.43)]):
    fern('PerimeterFern_%02d'%i,x,z,s)
    rock('PerimeterMossBed_%02d'%i,(x,z,.02),(.43,.35,.06),moss[i%4],'Perimeter',seed=570+i)

# A few quiet perimeter stones add age without filling the bamboo clearing.
for i,(x,z) in enumerate([(-6.85,3.60),(-6.65,3.94),(6.15,4.10),(6.55,3.9),(.1,-4.30),(7.10,-1.22)]):
    rock('PerimeterGroundStone_%02d'%i,(x,z,.09),(.30,.22,.17),stone[i%4],'Perimeter',seed=400+i)

# Apply evaluated geometry, then batch static parts by semantic group and material.
# PondWater remains independent for the runtime animation.
bpy.ops.object.select_all(action='DESELECT')
for obj in list(bpy.context.scene.objects):
    if obj.type in {'CURVE', 'MESH'}:
        obj.select_set(True)
if bpy.context.selected_objects:
    bpy.context.view_layer.objects.active=bpy.context.selected_objects[0]
    bpy.ops.object.convert(target='MESH')
batch = {}
for obj in list(bpy.context.scene.objects):
    if obj.type != 'MESH' or obj.name == 'PondWater':
        continue
    key=(obj.parent.name, tuple(m.name for m in obj.data.materials))
    batch.setdefault(key,[]).append(obj)
for (parent,mats), objects in batch.items():
    if len(objects) < 2:
        continue
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
    bpy.ops.object.join()
    bpy.context.object.name=parent+'_'+mats[0].replace(' ','_')
bpy.ops.object.select_all(action='DESELECT')
for obj in bpy.context.scene.objects:
    if obj.type=='MESH' or obj.type=='EMPTY':
        obj.select_set(True)

bpy.ops.export_scene.gltf(filepath=str(OUT/'garden.glb'),export_format='GLB',use_selection=True,
    export_apply=True,export_yup=True,export_normals=True,export_materials='EXPORT')

# Compute evaluated triangle count and THREE-coordinate bounds, including bevels.
deps=bpy.context.evaluated_depsgraph_get()
triangles=0
bounds_min=[1e9]*3
bounds_max=[-1e9]*3
nodes=[]
for obj in bpy.context.scene.objects:
    if obj.type!='MESH':
        continue
    nodes.append(obj.name)
    ev=obj.evaluated_get(deps)
    m=ev.to_mesh()
    m.calc_loop_triangles()
    triangles+=len(m.loop_triangles)
    for v in m.vertices:
        p=obj.matrix_world@v.co
        q=(p.x,p.z,-p.y)
        for i in range(3):
            bounds_min[i]=min(bounds_min[i],q[i])
            bounds_max[i]=max(bounds_max[i],q[i])
    ev.to_mesh_clear()
report={'path':str(OUT/'garden.glb'),'size_bytes':(OUT/'garden.glb').stat().st_size,
    'triangles':triangles,'bounds_three':{'min':bounds_min,'max':bounds_max},
    'groups':list(roots),'nodes':nodes,'bamboo_clearing':{'center':[-4,0,2.7],'size':[3,3]},
    'coordinate_system':'THREE Y-up (Blender x,-z,y); ground y=0'}
(OUT/'asset_report.json').write_text(json.dumps(report,indent=2))

# Neutral studio render is for QA only; no camera or lighting is included in GLB.
world=bpy.data.worlds.new('Warm neutral studio')
bpy.context.scene.world=world
world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.63,.68,.66,1)
world.node_tree.nodes['Background'].inputs[1].default_value=.7
bpy.ops.object.light_add(type='AREA',location=(-4,-5,12))
bpy.context.object.data.energy=1800
bpy.context.object.data.shape='DISK'
bpy.context.object.data.size=8
bpy.ops.object.camera_add(location=(13,-17,15))
cam=bpy.context.object
direction=Vector((0,0,.55))-cam.location
cam.rotation_euler=direction.to_track_quat('-Z','Y').to_euler()
cam.data.type='ORTHO'
cam.data.ortho_scale=21.3
bpy.context.scene.camera=cam
scene=bpy.context.scene
scene.render.engine='CYCLES'
scene.cycles.samples=12
scene.cycles.use_denoising=True
scene.render.resolution_x=1400
scene.render.resolution_y=1050
scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.render.filepath=str(OUT/'garden-preview.png')
scene.render.film_transparent=True
scene.view_settings.view_transform='AgX'
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'garden.blend'))
bpy.ops.render.render(write_still=True)
print('GARDEN_REPORT',json.dumps({k:v for k,v in report.items() if k!='nodes'}))
